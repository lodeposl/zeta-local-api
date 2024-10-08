export const PRODUCT_BY_CODE = function(ItemCode){
    ItemCode = ItemCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    ItemCode = ItemCode.replace("'","''");
    return `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        OITM.frozenFor = 'N'
        and PriceList=3 
        and OITM.ItemCode='${ItemCode}'`
}

export const FIRM_AND_COUNT = function(includeNoStock){
    includeNoStock = includeNoStock ? true : false

    const query = `
    select
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
        
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    where
        OITM.frozenFor = 'N'
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by FirmName asc`
    return query
}

export const PRODUCTS_BY_MARCA = function(FirmCode, includeNoStock){
    FirmCode = FirmCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    FirmCode = FirmCode.replace("'","''");
    includeNoStock = includeNoStock ? true : false
    const query = `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        U_NIV_I,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod,
        OITM.TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        OITM.frozenFor = 'N'
        and PriceList=3
        and OITM.FirmCode='${FirmCode}'
        ${includeNoStock ? '' : 'and OITM.onHand > 0'}
    order by ItemName asc
        `
    return query
}

export const MARCAS = function(){
    const query = `
    select
        FirmCode,
        FirmName
    from OMRC 
    order by FirmName asc`
    return query;
}

export const ALL_PRODUCTS = function(){
    const query = `
        select 
            OITM.ItemCode,
            OITM.ItmsGrpCod,
            ItemName,
            onHand,
            Price,
            FirmCode,
            frozenFor,
            OITM.TaxCodeAR
        from 
            OITM 
        join 
            ITM1 
                on OITM.ItemCode = ITM1.ItemCode 
        where 
            PriceList=3 
    `
    return query

}

export const ITEM_GROUPS = function(){
    const query = `
    select ItmsGrpCod, ItmsGrpNam from OITB
    `
    return query
}

export const PRODUCTS_BY_SEARCH = function(brandCode,search){
    search = search.replace(/[\[\]\(\)\;\+\:]/g, "")
    search = search.replace("'","''");

    if (brandCode){
        brandCode = brandCode.replace(/[\[\]\(\)\;\+\:]/g, "")
        brandCode = brandCode.replace("'","''");
    }

    const trimmed = search.trim()
    const split = trimmed.split(' ')
    let filter = ""
    console.log("brand", brandCode)
    if (brandCode){
        filter = `OITM.FirmCode = '${brandCode}' and `
    }
    console.log("split:", split)
    if (split.length=== 1){
        filter +=`(OITM.ItemCode like '%${trimmed}%' or ItemName like '%${trimmed}%' or OITM.U_NIV_I like '%${trimmed}%')`
    }else{
        filter += "("
        for (const part of split){
            filter += `(ItemName like '%${part}%' or OITM.ItemCode like '%${part}%' or OITM.U_NIV_I like '%${part}%') and `
        }
        filter = filter.slice(0, filter.length - 4)   
        filter += ")"
    }
    const query =`
    select
        OITM.ItemCode,
        ItemName,
        Price,
        OMRC.FirmCode,
        U_NIV_I,
        FirmName,
        onHand
    from OITM 
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
	join OMRC 
        on OMRC.FirmCode = OITM.FirmCode
    where 
        OITM.frozenFor = 'N' 
        and onHand >0 
        and PriceList='3' 
        and ${filter}
    group by
        OITM.ItemCode,
        ItemName,
        Price,
        OMRC.FirmCode,
        U_NIV_I,
        FirmName,
        onHand
    order by ItemName asc
    `
    console.log("quewry:" , query)
    return query
}